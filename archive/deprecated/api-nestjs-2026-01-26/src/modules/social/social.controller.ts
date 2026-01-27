import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { BuddyGroupType, PostType } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SocialService, type LocalizedContent } from './social.service';

@ApiTags('social')
@ApiBearerAuth()
@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    @Inject(SocialService) private readonly socialService: SocialService,
  ) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get social feed for user' })
  @ApiResponse({ status: 200, description: 'Return feed items.' })
  async getFeed(
    @Req() req: { user: { id: string } },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.socialService.getFeed(req.user.id, limit, offset);
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Like a social post' })
  @ApiResponse({ status: 200, description: 'Post liked successfully.' })
  async likePost(@Req() req: { user: { id: string } }, @Body('id') id: string) {
    return this.socialService.likePost(req.user.id, id);
  }

  @Post('posts/:id/comment')
  @ApiOperation({ summary: 'Comment on a social post' })
  @ApiResponse({ status: 201, description: 'Comment added successfully.' })
  async commentOnPost(
    @Req() req: { user: { id: string } },
    @Body('id') id: string,
    @Body('content') content: string,
  ) {
    return this.socialService.commentOnPost(req.user.id, id, content);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new social post' })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  async createPost(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      type: PostType;
      content: LocalizedContent;
      groupId?: string;
    },
  ) {
    return this.socialService.createPost(
      req.user.id,
      body.type,
      body.content,
      body.groupId,
    );
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get recommended groups for user' })
  @ApiResponse({ status: 200, description: 'Return group recommendations.' })
  async getRecommendations(@Req() req: { user: { id: string } }) {
    return this.socialService.getRecommendedGroups(req.user.id);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  async createGroup(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      name: string;
      description?: string;
      type?: BuddyGroupType;
    },
  ) {
    return this.socialService.createGroup(req.user.id, body);
  }

  @Post('groups/join')
  @ApiOperation({ summary: 'Join a group' })
  @ApiResponse({ status: 201, description: 'Joined group successfully.' })
  async joinGroup(
    @Req() req: { user: { id: string } },
    @Body('groupId') groupId: string,
  ) {
    return this.socialService.joinGroup(req.user.id, groupId);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get group details' })
  @ApiResponse({ status: 200, description: 'Return group details.' })
  async getGroupDetails(
    @Req() req: { user: { id: string } },
    @Body('id') id: string,
  ) {
    return this.socialService.getGroupDetails(id);
  }

  @Post('groups/:id/challenge')
  @ApiOperation({ summary: 'Create a group challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created successfully.' })
  async createChallenge(
    @Req() req: { user: { id: string } },
    @Body('id') id: string,
    @Body()
    body: {
      title: LocalizedContent;
      target: number;
      rewardPoints: number;
      days: number;
    },
  ) {
    // Should check if user is leader, but for MVP we allow members to propose
    return this.socialService.createGroupChallenge(id, body);
  }
}
