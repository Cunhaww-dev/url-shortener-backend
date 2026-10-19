import { IsUrl } from 'class-validator';

export class CreateLinkDto {
  @IsUrl(
    { require_protocol: true },
    { message: 'URL precisa ser um link válido com http:// ou https://' },
  )
  url: string;
}
