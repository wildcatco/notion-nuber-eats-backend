import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from './../jwt/jwt.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.usersRepository.findOne({ where: { email } });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      await this.usersRepository.save(
        this.usersRepository.create({ email, password, role }),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        return { ok: false, error: 'User not found' };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      const token = this.jwtService.sign(user.id);
      return { ok: true, token };
    } catch (error) {
      return { ok: false, error };
    }
  }

  findById(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async editProfile(userId: number, { email, password }: EditProfileInput) {
    // return this.usersRepository.update({ id: userId }, { ...editProfileInput });
    const user = await this.findById(userId);
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    return this.usersRepository.save(user);
  }
}
