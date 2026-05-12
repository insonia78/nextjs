import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class MessageType {
  @Field(() => ID) id: string;
  @Field() content: string;
  @Field() senderId: string;
  @Field() channelId: string;
  @Field() createdAt: Date;
  @Field({ nullable: true }) editedAt?: Date;
}

@ObjectType()
export class ChannelType {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() teamId: string;
  @Field() type: string;
  @Field() createdAt: Date;
}
