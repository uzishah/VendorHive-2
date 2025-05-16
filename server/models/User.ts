import mongoose from 'mongoose';

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['vendor', 'user'], 
    default: 'user' 
  },
  profileImage: String,
  phone: String,
  bio: String,
  location: String,
  joinedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add any instance methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password; // Don't expose password in JSON responses
  return user;
};

// Add any static methods
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

userSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username });
};

// Export the User model
const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export default UserModel;