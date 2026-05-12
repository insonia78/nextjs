import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { DocumentsService } from './documents.service';
import { DocumentType } from '../graphql/types';

@Resolver(() => DocumentType)
export class DocumentsResolver {
  constructor(private documentsService: DocumentsService) {}

  @Query(() => [DocumentType])
  documentsByTeam(@Args('teamId') teamId: string) {
    return this.documentsService.findByTeam(teamId);
  }

  @Query(() => DocumentType, { nullable: true })
  document(@Args('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Mutation(() => DocumentType)
  createDocument(
    @Args('title') title: string,
    @Args('teamId') teamId: string,
    @Args('authorId') authorId: string,
  ) {
    return this.documentsService.create(title, teamId, authorId);
  }

  @Mutation(() => DocumentType)
  updateDocumentContent(@Args('id') id: string, @Args('content') content: string) {
    return this.documentsService.updateContent(id, content);
  }

  @Mutation(() => DocumentType)
  updateDocumentTitle(@Args('id') id: string, @Args('title') title: string) {
    return this.documentsService.updateTitle(id, title);
  }

  @Mutation(() => DocumentType)
  deleteDocument(@Args('id') id: string) {
    return this.documentsService.delete(id);
  }
}
