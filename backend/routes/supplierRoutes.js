import express from "express";
import { supplierController } from "../controllers/supplierController.js";

const router = express.Router();

router.get("/", supplierController.getAll);
router.post("/", supplierController.create);

export default router;
