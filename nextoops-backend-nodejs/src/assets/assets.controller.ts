import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { ErpModuleGuard } from '../commons/guards/erp-module.guard';
import { AssetsService } from './assets.service';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get('inventory')
  @UseGuards(ErpModuleGuard('inventory'))
  getInventory() {
    return this.service.findAll('inventory');
  }

  @Post('inventory')
  @UseGuards(ErpModuleGuard('inventory'))
  createInventoryAsset(@Body() dto: any) {
    return this.service.create('inventory', dto);
  }

  @Get('stock')
  @UseGuards(ErpModuleGuard('stock'))
  getStock() {
    return this.service.findAll('stock');
  }

  @Post('stock')
  @UseGuards(ErpModuleGuard('stock'))
  createStockItem(@Body() dto: any) {
    return this.service.create('stock', dto);
  }

  @Get(':id')
  getAsset(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  updateAsset(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  deleteAsset(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/assign')
  assignAsset(@Param('id') id: string, @Body() dto: { userId: string }) {
    // We expect the frontend to pass the user ID. For a complete implementation,
    // we would fetch the user from UserService. For now, we mock the assignment
    // by creating a partial User object or relying on a real service call.
    // In a real app, inject UserService and fetch the user.
    const mockUser = { id: dto.userId } as User;
    return this.service.assign(id, dto.userId ? mockUser : null);
  }
}
