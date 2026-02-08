import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/respond";
import { HttpError } from "../../utils/httpError";
import { saveAddressSchema, updateAddressSchema } from "./addresses.schemas";
import * as addressService from "./addresses.service";
import { parseId } from "../../utils/parseId";

export const saveAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  
  const body = saveAddressSchema.parse(req.body);
  const result = await addressService.saveAddress(req.auth.id, body);
  return ok(res, result);
});

export const getAddressesHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  
  const result = await addressService.getAddresses(req.auth.id);
  return ok(res, result);
});

export const deleteAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");
  
  const id = parseId(req.params.id);
  const result = await addressService.deleteAddress(req.auth.id, id);
  return ok(res, result);
});

export const updateAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const id = parseId(req.params.id);
  const body = updateAddressSchema.parse(req.body);
  const result = await addressService.updateAddress(req.auth.id, id, body);
  return ok(res, result);
});

export const setPrimaryAddressHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new HttpError(401, "Unauthenticated");

  const id = parseId(req.params.id);
  const result = await addressService.setPrimaryAddress(req.auth.id, id);
  return ok(res, result);
});
