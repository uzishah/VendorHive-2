import mongoose from 'mongoose';

// Define the Booking schema
const bookingSchema = new mongoose.Schema({
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
  serviceId: { 
    type: Number,
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid service ID!`
    }
  },
  date: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  notes: String,
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
bookingSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Add instance methods
bookingSchema.methods.updateStatus = function(newStatus: string) {
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
    throw new Error('Invalid booking status');
  }
  this.status = newStatus;
  return this.save();
};

// Add static methods
bookingSchema.statics.findByUserId = function(userId: mongoose.Types.ObjectId | string) {
  return this.find({ userId }).sort({ date: -1 });
};

bookingSchema.statics.findByVendorId = function(vendorId: number) {
  return this.find({ vendorId }).sort({ date: -1 });
};

bookingSchema.statics.findPendingBookings = function(vendorId: number) {
  return this.find({ 
    vendorId,
    status: 'pending',
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

// Set up the model to include virtuals when converted to JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Create compound indexes for frequent queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });
bookingSchema.index({ date: 1, status: 1 });

// Export the Booking model
const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default BookingModel;