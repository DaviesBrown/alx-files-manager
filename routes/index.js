import express from "express";
import AppController from "../controllers/AppController";
import UsersController from "../controllers/UsersController";
import AuthController from "../controllers/AuthController";
import FilesController from "../controllers/FilesController";

const router = express.Router();

// AppController routes
router.get("/status", AppController.getStatus);
router.get("/stats", AppController.getStats);

// UserController routes
router.post("/users", UsersController.postNew);
router.get("/users/me", UsersController.getMe);

// AuthController routes
router.get("/connect", AuthController.getConnect);
router.get("/disconnect", AuthController.getDisconnect);

// FileController routes
router.post("/files", FilesController.postUpload);
router.get("/files/:id", FilesController.getShow);
router.get("/files", FilesController.getIndex);

export default router;
