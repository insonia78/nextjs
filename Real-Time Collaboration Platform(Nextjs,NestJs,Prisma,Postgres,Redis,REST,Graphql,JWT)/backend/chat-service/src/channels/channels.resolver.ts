import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ChannelsService } from './channels.service';
import { ChannelType } from '../graphql/types';

@Resolver(() => ChannelType)
export class ChannelsResolver {
  constructor(private channelsService: ChannelsService) {}

  @Query(() => [ChannelType])
  channelsByTeam(@Args('teamId') teamId: string) {
    return this.channelsService.findByTeam(teamId);
  }

  @Mutation(() => ChannelType)
  createChannel(
    @Args('name') name: string,
    @Args('teamId') teamId: string,
    @Args('type', { defaultValue: 'TEXT' }) type: string,
  ) {
    return this.channelsService.create(name, teamId, type);
  }
}
