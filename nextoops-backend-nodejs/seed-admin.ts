import { UserType } from './src/user/enums/user-type.enum';
import { User } from './src/user/entities/user.entity';
import { Permission } from './src/commons/permissions/permissions';


export async function seedAdmins() {
  const email = 'jedlahrim20@gmail.com';
  const password = 'Admin123!';

  try {
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      const newUser = User.create({
        email,
        password,
        type: UserType.SUPER_USER,
        permissions: Permission.SUPER_USER_DEFAULT_PERMISSIONS,
      });

      await User.save(newUser);
    } else {
      if (user.type !== UserType.SUPER_USER) {
        user.type = UserType.SUPER_USER;
        await User.save(user);
      }
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
}
