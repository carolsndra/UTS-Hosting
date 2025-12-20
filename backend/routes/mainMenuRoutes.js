import { Router } from "express";
import multer from "multer";
import { itemsController } from "../controllers/mainMenu.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Hanya gambar PNG/JPG/WEBP"), false);
    }
    cb(null, true);
  }
});

router.get("/", itemsController.list);
router.get("/:id", itemsController.getOne);

router.post(
  "/",
  upload.single("foto"),
  itemsController.create
);

router.put(
  "/:id",
  upload.single("foto"),
  itemsController.update
);

router.delete("/:id", itemsController.remove);

export default router;
