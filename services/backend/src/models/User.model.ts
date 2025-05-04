import {AuthRole} from '../auth';

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly image?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly role?: AuthRole = AuthRole.USER;
  readonly banned?: boolean = false;
  readonly banReason?: string | null = null;
  readonly banExpires?: Date | null = null;

  constructor(props: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role?: AuthRole;
    banned?: boolean;
    banReason?: string | null;
    banExpires?: Date | null;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.emailVerified = props.emailVerified;
    this.image = props.image;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.role = props.role;
    this.banned = props.banned;
    this.banReason = props.banReason;
    this.banExpires = props.banExpires;
  }

  static builder(): UserBuilder {
    return new UserBuilder();
  }
}

class UserBuilder {
  private _id!: string;
  private _name!: string;
  private _email!: string;
  private _emailVerified!: boolean;
  private _image?: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;
  private _role?: AuthRole;
  private _banned?: boolean;
  private _banReason?: string;
  private _banExpires?: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withGeneratedId(): this {
    this._id = crypto.randomUUID();
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withEmailVerified(emailVerified: boolean): this {
    this._emailVerified = emailVerified;
    return this;
  }

  withImage(image: string): this {
    this._image = image;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  withRole(role: AuthRole): this {
    this._role = role;
    return this;
  }

  withBanReason(reason: string, expires?: Date): this {
    this._banned = true;
    this._banReason = reason;
    this._banExpires = expires;
    return this;
  }

  build(): User {
    const requiredAttrs = ['_id', '_name', '_email'];
    const missingAttrs = requiredAttrs.filter(attr => !this[attr as keyof UserBuilder]);
    if (missingAttrs.length > 0) {
      throw new Error(`Missing required fields for User: ${missingAttrs.join(', ')}`);
    }

    return new User({
      id: this._id,
      name: this._name,
      email: this._email,
      emailVerified: this._emailVerified || false,
      image: this._image || null,
      createdAt: this._createdAt || new Date(),
      updatedAt: this._updatedAt || new Date(),
      role: this._role || AuthRole.USER,
      banned: this._banned || false,
      banReason: this._banReason || null,
      banExpires: this._banExpires || null,
    });
  }
}
