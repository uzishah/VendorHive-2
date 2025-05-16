import mongoose from 'mongoose';

// Define the Review schema
const reviewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vendorId: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid vendor ID!`
    }
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  comment: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
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
  }
});

// Add virtual relationships
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Add hooks (middlewares)
reviewSchema.post('save', async function(doc) {
  // This will update the vendor's average rating after a review is saved
  // You would need to implement this logic in a controller or service
  // since we need to calculate the average rating across all reviews
  try {
    const VendorModel = mongoose.model('Vendor');
    const vendor = await VendorModel.findOne({ id: doc.vendorId });
    if (vendor) {
      const reviewModel = mongoose.model('Review');
      const reviews = await reviewModel.find({ vendorId: doc.vendorId });
      
      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / reviews.length;
        
        vendor.rating = avgRating;
        vendor.reviewCount = reviews.length;
        await vendor.save();
      }
    }
  } catch (err) {
    console.error('Error updating vendor rating:', err);
  }
});

// Add static methods
reviewSchema.statics.findByVendorId = function(vendorId: number) {
  return this.find({ vendorId })
    .sort({ createdAt: -1 })
    .populate('user', 'name profileImage');
};

reviewSchema.statics.getAverageRating = async function(vendorId: number) {
  const result = await this.aggregate([
    { $match: { vendorId } },
    { $group: { 
        _id: '$vendorId', 
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      } 
    }
  ]);
  
  return result.length > 0 
    ? { rating: result[0].avgRating, count: result[0].count } 
    : { rating: 0, count: 0 };
};

// Set up the model to include virtuals when converted to JSON
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

// Create indexes for frequent queries
reviewSchema.index({ vendorId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, vendorId: 1 }, { unique: true }); // One review per user per vendor

// Export the Review model
const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default ReviewModel;