import { Company } from '../models/Company.js';
import { generateToken } from '../utils/token.js';

function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sanitizeCompany(company) {
  return {
    _id: company._id,
    companyName: company.companyName,
    businessEmail: company.businessEmail,
    phoneNumber: company.phoneNumber,
    industryType: company.industryType,
    businessSize: company.businessSize,
    gstin: company.gstin,
    country: company.country,
    currency: company.currency,
    isPhoneVerified: company.isPhoneVerified,
    hasCompletedOnboarding: company.hasCompletedOnboarding,
    createdAt: company.createdAt,
  };
}

/**
 * Register a new Indian SME
 */
export async function register(req, res) {
  try {
    const {
      companyName,
      businessEmail,
      phoneNumber,
      password,
      industryType,
      businessSize,
      gstin,
    } = req.body;

    if (!companyName || !businessEmail || !phoneNumber || !password || !industryType || !businessSize) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all mandatory SME registration details: Company Name, Business Email, Phone Number, Password, Industry Type, and Business Size.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const existingEmail = await Company.findOne({ businessEmail: businessEmail.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'A company account with this business email is already registered.',
      });
    }

    // Generate 6-digit OTP with 10-minute validity
    const otp = generate6DigitOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const company = new Company({
      companyName: companyName.trim(),
      businessEmail: businessEmail.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      industryType,
      businessSize,
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      isPhoneVerified: false,
      otpCode: otp,
      otpExpiresAt,
      hasCompletedOnboarding: false,
      currency: 'INR',
    });

    await company.save();

    // Log OTP explicitly to server terminal console for developer/demo inspection
    console.log('\n=============================================================');
    console.log(`[INDIAN SME OTP VERIFICATION SERVICE]`);
    console.log(`Target SME   : ${company.companyName}`);
    console.log(`Phone Number : ${company.phoneNumber}`);
    console.log(`Email        : ${company.businessEmail}`);
    console.log(`👉 VERIFICATION OTP CODE: [ ${otp} ] (Valid for 10 minutes)`);
    console.log('=============================================================\n');

    res.status(201).json({
      success: true,
      message: `Registration initiated. An OTP has been dispatched to your contact phone number (${company.phoneNumber}). Please enter the OTP to activate your account.`,
      businessEmail: company.businessEmail,
      phoneNumber: company.phoneNumber,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Verify OTP to complete SME registration
 */
export async function verifyOtp(req, res) {
  try {
    const { businessEmail, otp } = req.body;

    if (!businessEmail || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both business email and the 6-digit OTP code.',
      });
    }

    const company = await Company.findOne({ businessEmail: businessEmail.toLowerCase().trim() });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company account not found.' });
    }

    if (!company.otpCode || company.otpCode !== otp.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid OTP code. Please re-check the OTP.' });
    }

    if (company.otpExpiresAt && company.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'The OTP code has expired. Please request a new OTP code.',
      });
    }

    // Activate phone verification
    company.isPhoneVerified = true;
    company.otpCode = null;
    company.otpExpiresAt = null;
    await company.save();

    const token = generateToken(company._id);

    res.json({
      success: true,
      message: 'Phone number verified successfully. Welcome to CarbonIQ!',
      token,
      company: sanitizeCompany(company),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Resend OTP to company contact number
 */
export async function resendOtp(req, res) {
  try {
    const { businessEmail } = req.body;
    if (!businessEmail) {
      return res.status(400).json({ success: false, error: 'Business email is required.' });
    }

    const company = await Company.findOne({ businessEmail: businessEmail.toLowerCase().trim() });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company account not found.' });
    }

    const otp = generate6DigitOtp();
    company.otpCode = otp;
    company.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await company.save();

    console.log('\n=============================================================');
    console.log(`[INDIAN SME RESEND OTP SERVICE]`);
    console.log(`Target SME   : ${company.companyName}`);
    console.log(`Phone Number : ${company.phoneNumber}`);
    console.log(`👉 RESENT OTP CODE: [ ${otp} ] (Valid for 10 minutes)`);
    console.log('=============================================================\n');

    res.json({
      success: true,
      message: `A new OTP has been dispatched to ${company.phoneNumber}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Login for registered SMEs
 */
export async function login(req, res) {
  try {
    const { businessEmail, password } = req.body;

    if (!businessEmail || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both business email and password.',
      });
    }

    const company = await Company.findOne({ businessEmail: businessEmail.toLowerCase().trim() });
    if (!company) {
      return res.status(401).json({ success: false, error: 'Invalid business email or password.' });
    }

    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid business email or password.' });
    }

    if (!company.isPhoneVerified) {
      // Generate OTP and log to console
      const otp = generate6DigitOtp();
      company.otpCode = otp;
      company.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await company.save();

      console.log('\n=============================================================');
      console.log(`[INDIAN SME LOGIN OTP DISPATCH]`);
      console.log(`Target SME   : ${company.companyName}`);
      console.log(`Phone Number : ${company.phoneNumber}`);
      console.log(`👉 VERIFICATION OTP CODE: [ ${otp} ]`);
      console.log('=============================================================\n');

      return res.status(403).json({
        success: false,
        requiresOtp: true,
        businessEmail: company.businessEmail,
        phoneNumber: company.phoneNumber,
        error: 'Phone number verification is pending. An OTP has been logged to the server console.',
      });
    }

    const token = generateToken(company._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      company: sanitizeCompany(company),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get profile of currently logged-in SME
 */
export async function getMe(req, res) {
  try {
    res.json({
      success: true,
      company: sanitizeCompany(req.company),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Mark onboarding document step as completed
 */
export async function completeOnboarding(req, res) {
  try {
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found.' });
    }

    company.hasCompletedOnboarding = true;
    await company.save();

    res.json({
      success: true,
      message: 'Onboarding completed. Welcome to your main SME carbon workspace.',
      company: sanitizeCompany(company),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
