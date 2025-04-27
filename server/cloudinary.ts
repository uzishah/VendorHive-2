import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dvyscyju7';
const apiKey = process.env.CLOUDINARY_API_KEY || '822959684783674';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'HwMpmGKSuM0XlhUPDzSV10Y5MaQ';

// Log Cloudinary configuration (without exposing full secret)
console.log(`Configuring Cloudinary with cloud_name: ${cloudName}`);
console.log(`API Key present: ${apiKey ? 'Yes' : 'No'}`);
console.log(`API Secret present: ${apiSecret ? 'Yes' : 'No'}`);

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('WARNING: Missing Cloudinary configuration. Image uploads will fail.');
} else {
  console.log('Cloudinary configuration is complete and ready for image uploads');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Setup storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vendorhive',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  } as any
});

// Create multer upload middleware
export const upload = multer({ storage: storage });

// Helper function to upload image directly
export const uploadImage = async (file: any) => {
  try {
    console.log(`Attempting to upload file to Cloudinary: ${file.originalname || 'unknown'}`);
    
    // Double-check Cloudinary configuration - now we use the fallback values so this should always pass
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary configuration is incomplete. Check environment variables.');
      throw new Error('Cloudinary configuration is missing');
    }
    
    // Perform the upload
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto', // auto-detect the file type
      folder: 'vendorhive'   // place uploads in a folder
    });
    
    console.log(`Successfully uploaded to Cloudinary. URL: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    throw error;
  }
};

export default cloudinary;