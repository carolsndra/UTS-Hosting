import express from "express";
import { transactionController } from "../controllers/transactionsController.js";

const router = express.Router();

router.post("/in", transactionController.createIn);
router.post("/out", transactionController.createOut);

// LIST ALL TRANSACTIONS WITH DETAILS (FOR STOCK LOG & HISTORY)
router.get("/", transactionController.getAllTransactions);
router.get("/today", transactionController.getTodayTransactions);
router.get("/summary", transactionController.summary);
router.get("/summary/today", transactionController.summaryToday);
router.get("/chart/weekly", transactionController.weekly);

export default router;
