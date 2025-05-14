import mongoose from "mongoose";
import bcrypt from "bcrypt";
import config from "config";

export interface UserDocumet extends mongoose.Document {
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next: mongoose.HookNextFunction) {
  let user = this as UserDocumet;

  if (user.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(config.get<number>("SALT_WORK_FACTOR"));

  const hash = await bcrypt.hashSync(user.password, salt);

  user.password = hash;
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    const user = this as UserDocumet

    return bcrypt.compare(candidatePassword, user.password).catch((e) => false)
}

const User = mongoose.model("User", userSchema);

export default User;
