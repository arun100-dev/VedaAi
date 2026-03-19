import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import Joi from 'joi';

const JWT_SECRET = process.env.JWT_SECRET || 'vedaai-secret-key';
const JWT_EXPIRES = '7d';

function generateToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  school: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export async function register(req: Request, res: Response) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const exists = await UserModel.findOne({ email: value.email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await UserModel.create(value);
    const token = generateToken(user._id.toString());

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, school: user.school },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const user = await UserModel.findOne({ email: value.email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await user.comparePassword(value.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = generateToken(user._id.toString());

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, school: user.school },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const user = await UserModel.findById((req as any).userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
