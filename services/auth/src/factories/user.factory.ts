import { User } from "../domain/entities/User.js";

export class UserFactory {
  static createEmailUser(
    name: string,
    email: string,
    passwordHash: string,
    verificationToken: string,
    verificationExpiry: Date
  ): User {
    return new User(
      "",
      name,
      email,
      null,
      false,
      ["email"],
      "",
      false,
      passwordHash,
      verificationToken,
      verificationExpiry
    );
  }

  static createGoogleUser(
    name: string,
    email: string,
    image: string
  ): User {
    return new User(
      "",
      name,
      email,
      null,
      true,
      ["google"],
      image,
      false
    );
  }
}
