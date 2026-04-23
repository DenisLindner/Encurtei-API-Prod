import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  NotContains,
} from 'class-validator';

export class CreateLinkDTO {
  @IsUrl()
  @IsNotEmpty()
  originalUrl!: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Deve conter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Deve conter no máximo 100 caracteres' })
  @NotContains(' ', { message: 'Não pode conter espaços' })
  @Matches(/^[A-Za-z0-9.-]+$/, {
    message: 'Caminho deve ter apenas letras, números, . e -',
  })
  path?: string;
}
