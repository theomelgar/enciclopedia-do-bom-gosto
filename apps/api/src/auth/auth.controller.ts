import { Controller, Post, Get, Patch, Body, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { updateProfileSchema } from "@ebg/shared-types";
// Contrato: API_SPEC.md §Auth
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("magic-link")
  requestMagicLink(@Body("email") email: string) {
    return this.authService.sendMagicLink(email);
  }

  @Public()
  @Get("callback")
  callback(@Req() req: any) {
    return this.authService.exchangeToken(req.query.access_token);
  }

  @Get("me")
  me(@Req() req: any) {
    // req.user/req.spaceId já populados pelo AuthGuard.
    return this.authService.getCurrentUser(req.user, req.spaceId);
  }

  @Patch("me")
  updateMe(@Req() req: any, @Body() body: unknown) {
    const dto = updateProfileSchema.parse(body);

    return this.authService.updateProfile(req.user.id, dto);
  }

  @Get("me/avatar-url")
    avatarUrl(@Req() req: any) {
    return this.authService.getAvatarSignedUrl(req.user.id);
  }
}
