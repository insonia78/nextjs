import { Resolver, Query, Mutation, Args, Subscription, Int } from '@nestjs/graphql';
import { MessagesService } from './messages.service';
import { MessageType } from '../graphql/types';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => MessageType)
export class MessagesResolver {
  constructor(private messagesService: MessagesService) {}

  @Query(() => [MessageType])
  messages(
    @Args('channelId') channelId: string,
    @Args('take', { type: () => Int, defaultValue: 50 }) take: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  ) {
    return this.messagesService.findByChannel(channelId, take, skip);
  }

  @Mutation(() => MessageType)
  async sendMessage(
    @Args('content') content: string,
    @Args('senderId') senderId: string,
    @Args('channelId') channelId: string,
  ) {
    const message = await this.messagesService.create(content, senderId, channelId);
    pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  @Subscription(() => MessageType, {
    filter: (payload, variables) =>
      payload.messageAdded.channelId === variables.channelId,
  })
  messageAdded(@Args('channelId') channelId: string) {
    return pubSub.asyncIterator('messageAdded');
  }
}
