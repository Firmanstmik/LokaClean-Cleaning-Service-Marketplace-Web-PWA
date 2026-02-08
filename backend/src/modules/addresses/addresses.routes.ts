import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as controller from "./addresses.controller";

const router = Router();

router.use(authenticate);

router.post("/save", controller.saveAddressHandler);
router.get("/list", controller.getAddressesHandler);
router.delete("/:id", controller.deleteAddressHandler);
router.put("/:id", controller.updateAddressHandler);
router.patch("/:id/set-primary", controller.setPrimaryAddressHandler);

export default router;
