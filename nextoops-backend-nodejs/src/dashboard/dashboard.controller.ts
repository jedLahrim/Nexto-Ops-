import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  @Get('summary')
  getSummary() {
    return {
      assets: {
        total: 22,
        assigned: 0,
        inStock: 0,
        totalValue: 0,
        expiringWarranties: 0,
        byStatus: {
          'IN_USE': 0,
          'IN_STOCK': 0,
          'MAINTENANCE': 0,
          'RETIRED': 0
        },
        byCategory: {}
      },
      incidents: {
        open: 0,
        critical: 0,
        avgResolutionHours: 0,
        attention: [],
        sla: {
          compliancePct: 100,
          breached: 0,
          atRisk: 0
        }
      },
      stock: {
        lowStock: 0,
        totalItems: 0,
        stockValue: 0
      },
      maintenance: {
        dueSoon: 0,
        upcoming: []
      },
      stockRequests: {
        pending: 0
      }
    };
  }
}
