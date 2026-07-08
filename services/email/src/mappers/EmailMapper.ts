import { EmailMessage } from "../domain/entities/EmailMessage.js";
import { SendEmailDto } from "../dto/SendEmailDto.js";

export class EmailMapper {
  static toDto(domain: EmailMessage): SendEmailDto {
    return {
      to: domain.to,
      subject: domain.subject,
      html: domain.html,
      text: domain.text
    };
  }
}
