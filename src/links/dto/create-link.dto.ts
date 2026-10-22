import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://github.com/Cunhaww-dev' })
  @IsUrl(
    { require_protocol: true },
    { message: 'URL precisa ser um link válido com http:// ou https://' },
  )
  url: string;
}
