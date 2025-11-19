// 모든 /api/auth/* 라우트

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { auth } from "../middlewares/session";
import { createSession, deleteSession } from "../services/session";
import { getUsersCollection } from "../db/users";

const router = Router();

/* -------------------------
   POST /signup
-------------------------- */
router.post("/signup", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "bad_request" });
  }

  const users = getUsersCollection();
  const exists = await users.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "email exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const { insertedId } = await users.insertOne({
    email,
    password: hashed,
    name,
    createdAt: new Date(),
  });

  const user = await users.findOne({ _id: insertedId });
  if (!user) {
    return res.status(500).json({ message: "user create failed" });
  }

  await createSession(res, {
    userId: user._id.toString(),
    name: user.name,
  });

  res.status(201).json({
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  });
});

/* -------------------------
   POST /login
-------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = getUsersCollection();
  const me = await users.findOne({ email });

  if (!me) {
    return res.status(401).json({ message: "invalid" });
  }

  const ok = await bcrypt.compare(password, me.password);
  if (!ok) {
    return res.status(401).json({ message: "invalid" });
  }

  await createSession(res, {
    userId: me._id.toString(),
    name: me.name,
  });

  res.json({
    user: {
      _id: me._id.toString(),
      email: me.email,
      name: me.name,
    },
  });
});

/* -------------------------
   POST /logout
-------------------------- */
router.post("/logout", async (req, res) => {
  await deleteSession(req.cookies?.sid);
  res.clearCookie("sid", { path: "/" });
  res.json({ success: true });
});

/* -------------------------
   GET /me
-------------------------- */
router.get("/me", auth, async (req, res) => {
  const users = getUsersCollection();
  const userSession = (req as any).user;

  const me = await users.findOne({
    _id: new ObjectId(userSession.userId),
  });

  if (!me) {
    return res.status(404).json({ message: "not found" });
  }

  res.json({
    user: {
      _id: me._id.toString(),
      email: me.email,
      name: me.name,
    },
  });
});

export default router;
