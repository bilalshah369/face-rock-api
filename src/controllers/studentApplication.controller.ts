// controllers/studentApplication.controller.ts
import { Request, Response } from "express";
import * as service from "../services/studentApplication.service";

export const bulkUploadStudentApplications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.user_id; // from auth middleware
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided",
      });
    }

    const result = await service.bulkCreateStudentApplications(rows, userId);

    res.json({
      success: true,
      message: "Student applications uploaded successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const viewStudentApplications = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      application_ref_no,
      exam_name,
      shift,
      status,
      from_date,
      to_date,
    } = req.query;

    const result = await service.getStudentApplications({
      page: Number(page),
      limit: Number(limit),
      application_ref_no,
      exam_name,
      shift,
      status,
      from_date,
      to_date,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const createStudentQrBulk = async (req: Request, res: Response) => {
  try {
    const filters = req.body;

    // filters are OPTIONAL
    const result = await service.bulkGenerateStudentQrCodes(
      filters,
      req.user.user_id
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Bulk student QR generation failed",
    });
  }
};
