import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateLinkDTO {
  @IsUrl()
  @IsNotEmpty()
  originalUrl!: string;
}
