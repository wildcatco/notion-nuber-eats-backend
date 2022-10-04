import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { JwtService } from './../jwt/jwt.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Verification)
    private readonly verificationsRepository: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  @CatchError('Failed to create account')
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    const exists = await this.usersRepository.findOne({ where: { email } });
    if (exists) {
      return { ok: false, error: 'There is a user with that email already' };
    }
    const user = await this.usersRepository.save(
      this.usersRepository.create({ email, password, role }),
    );
    const verification = await this.verificationsRepository.save(
      this.verificationsRepository.create({
        user,
      }),
    );
    this.mailService.sendVerificationEmail(user.email, verification.code);
    return { ok: true };
  }

  @CatchError('Failed to login')
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
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
  }

  @CatchError('Failed to find user')
  async findById({ userId }: UserProfileInput): Promise<UserProfileOutput> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      return {
        ok: false,
        error: 'User Not Found',
      };
    }
    return {
      ok: true,
      user,
    };
  }

  @CatchError('Failed to edit profile')
  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    if (email) {
      const exist = await this.usersRepository.findOne({ where: { email } });
      if (exist) {
        return { ok: false, error: 'Email is already in use' };
      }

      await this.usersRepository.update(userId, {
        email,
        verified: false,
      });

      const updatedUser = await this.usersRepository.findOne({
        where: { id: userId },
      });

      const verification = await this.verificationsRepository.findOne({
        where: { user: { id: userId } },
      });
      if (verification) {
        await this.verificationsRepository.delete(verification.id);
      }

      const newVerification = await this.verificationsRepository.save(
        this.verificationsRepository.create({
          user: updatedUser,
        }),
      );
      this.mailService.sendVerificationEmail(
        updatedUser.email,
        newVerification.code,
      );
    }
    if (password) {
      this.usersRepository.update(userId, {
        password,
      });
    }
    return { ok: true };
  }

  @CatchError('Failed to verify email')
  async verifyEmail({ code }: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const verification = await this.verificationsRepository.findOne({
      where: { code },
      relations: ['user'],
    });
    if (verification) {
      await this.usersRepository.update(verification.user.id, {
        verified: true,
      });
      await this.verificationsRepository.delete(verification.id);
      return { ok: true };
    }
    return { ok: false, error: 'Verification not found' };
  }
}
