import mongoose from 'mongoose';

// Define the Vendor schema
const vendorSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  businessName: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  services: [String],
  businessHours: Object,
  coverImage: String,
  rating: { 
    type: Number, 
    default: 0 
  },
  reviewCount: { 
    type: Number, 
    default: 0 
  },
  id: { 
    type: Number, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid positive numeric ID!`
    } 
  } // Numeric ID field for internal references
});

// Add virtual for getting the full vendor profile with user data
vendorSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Add instance methods if needed
vendorSchema.methods.updateRating = async function(newRating: number) {
  const oldTotal = this.rating * this.reviewCount;
  this.reviewCount += 1;
  this.rating = (oldTotal + newRating) / this.reviewCount;
  return this.save();
};

// Add static methods
vendorSchema.statics.findByUserId = function(userId: mongoose.Types.ObjectId | string) {
  return this.findOne({ userId });
};

vendorSchema.statics.findByBusinessName = function(businessName: string) {
  return this.find({ businessName: new RegExp(businessName, 'i') });
};

// Set up the model to include virtuals when converted to JSON
vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

// Export the Vendor model
const VendorModel = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

export default VendorModel;