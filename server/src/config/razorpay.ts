import Razorpay from 'razorpay';
import { config } from './env';

export const razorpay = config.razorpayKeyId && config.razorpayKeySecret
    ? new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret,
    })
    : null;

if (!razorpay) {
    console.warn('⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Payment features will be disabled.');
}
