import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUserPayload } from '@common/types';
import { CurrentUser, Public } from '@core/decorators';

import { AuthService } from './auth.service';
import { AuthResponse, CurrentUserResponse, LoginDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiResponse({ status: 200, type: AuthResponse })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user payload' })
  @ApiResponse({ status: 200, type: CurrentUserResponse })
  getMe(@CurrentUser() user: CurrentUserPayload): CurrentUserResponse {
    return CurrentUserResponse.fromCurrentUser(user);
  }
}
