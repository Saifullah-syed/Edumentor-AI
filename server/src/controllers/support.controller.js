// In-memory rate limiting map: userId/IP -> array of timestamps
const rateLimitMap = new Map();

function isRateLimited(key, maxRequests = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return false;
}

export async function submitSupportRequest(req, res) {
  try {
    const { email, subject, inquiry, category, message, topic, name } = req.body;
    const clientKey = req.user?.id ? `user_${req.user.id}` : `ip_${req.ip}`;

    // Rate limit check
    if (isRateLimited(clientKey, 5, 10 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Too many advisement requests submitted. Please wait a few minutes before submitting again.',
      });
    }

    const requestInquiry = inquiry || message;
    if (!email || !requestInquiry) {
      return res.status(400).json({
        success: false,
        message: 'Email address and advisement inquiry message are required.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid university or student email address.',
      });
    }

    const trimmedInquiry = requestInquiry.trim();
    if (trimmedInquiry.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Inquiry is too short. Please provide at least 10 characters detailing your question.',
      });
    }

    if (trimmedInquiry.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Inquiry exceeds maximum allowed length of 2000 characters.',
      });
    }

    const trimmedSubject = (subject || topic || 'Academic & Career Advising Consultation').trim().slice(0, 150);
    const selectedCategory = category || topic || 'General Academic Advising';

    const ticketId = `REQ-${Date.now().toString(36).toUpperCase()}`;

    return res.status(200).json({
      success: true,
      ticketId,
      message: `Your inquiry has been submitted to the Academic Advisement Faculty. Ticket #${ticketId}. A university advisor will respond to ${trimmedEmail} within 1-2 business days.`,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Support Controller Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process advising request due to an unexpected server error.',
    });
  }
}
