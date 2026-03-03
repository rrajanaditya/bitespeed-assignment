import { Router } from "express";
import { identifyContact } from "../controllers/contact.controller.js";

const router = Router();
router.post("/identify", identifyContact);

export default router;
