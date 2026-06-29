import { Controller, Get, Header, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { Roles } from "../decorators/roles.decorator.js";
import { RolesGuard } from "../guards/roles.guard.js";
import { AnalyticsService } from "../services/analytics.service.js";

@Controller("analytics")
@UseGuards(RolesGuard)
@Roles("OWNER", "ADMIN", "BRANCH_MANAGER")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("summary")
  summary(@Query("start") start?: string, @Query("end") end?: string, @Query("branchId") branchId?: string) {
    return this.analytics.summary(start, end, branchId);
  }

  @Get("tickets.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async ticketsCsv(@Res() response: Response, @Query("start") start?: string, @Query("end") end?: string, @Query("branchId") branchId?: string) {
    const csv = await this.analytics.ticketsCsv(start, end, branchId);
    response.header("Content-Disposition", "attachment; filename=\"qms-tickets.csv\"");
    response.send(csv);
  }
}
