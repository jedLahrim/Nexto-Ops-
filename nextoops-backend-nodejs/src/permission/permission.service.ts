import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserType } from '../user/enums/user-type.enum';
import { AppError } from '../commons/errors/app-error';
import { ERR_PERMISSIONS_UNAUTHORIZED } from '../commons/errors/errors-codes';
import { UserPermissionsType } from '../user/enums/user-permission.enum';
import { isEmpty } from 'lodash';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getManageableNodeUsers(
    parentNode: User,
    childNodes: User[],
    requiredPermissions: UserPermissionsType[],
  ): Promise<User[]> {
    if (parentNode.isRoot) return childNodes;
    const manageableNodeUsers: User[] = [];
    // for complex check is
    const remainingNodeUsers: User[] = [];
    const allNodes: string[] = [];

    // to increase performance
    childNodes.forEach((childNode) => {
      if (childNode.isDescendantOf(parentNode.id)) manageableNodeUsers.push(childNode);
      else {
        remainingNodeUsers.push(childNode);
        allNodes.push(...childNode.nodes);
      }
    });

    // remove duplicate
    const nodesIds = Array.from(new Set(allNodes));

    // all ancestor users for all childNodes at one query
    const allAncestorUsers = await this._findAllByIds(nodesIds);

    for (const childNode of remainingNodeUsers) {
      const childNodeAncestorUsers = allAncestorUsers.filter((ancestorUser) =>
        childNode.nodes.includes(ancestorUser.id),
      );
      const topLevelNode = this.getTopLevelNodeByPermission(childNodeAncestorUsers, requiredPermissions);

      const allowed = this._canManageByTopLevelAndParentNode(topLevelNode, parentNode, childNode);
      if (allowed) manageableNodeUsers.push(childNode);
    }

    return manageableNodeUsers;
  }

  async findAllAncestorsNodes(nodeUserId: string): Promise<User[]> {
    const nodeUser = await this.userRepo.findOneOrFail({
      where: { id: nodeUserId },
    });
    return this._findAllByIds(nodeUser.nodes);
  }

  getTopLevelNodeByPermission(
    ancestorUsers: User[],
    requiredPermissions: UserPermissionsType[],
    userType?: UserType,
  ): User {
    const reversedUsers = ancestorUsers.reverse();
    let topLevelAncestorUser: User;
    for (const user of reversedUsers) {
      if (!user.isRoot && user.hasPermissions(requiredPermissions)) {
        if (!userType || user.type == userType) topLevelAncestorUser = user;
      } else {
        // break with last selected user is the topLevelAncestorUser
        break;
      }
    }
    return topLevelAncestorUser;
  }

  async checkCanManageNodeUserOrFail(
    parentNode: User,
    childNode: User,
    requiredPermissions: UserPermissionsType[],
    canManagerPermissions?: boolean,
  ) {
    const can = await this._checkCanManageNodeUser(parentNode, childNode, requiredPermissions, canManagerPermissions);

    if (!can)
      throw new UnauthorizedException(
        new AppError(ERR_PERMISSIONS_UNAUTHORIZED, {
          requiredPermissions: requiredPermissions,
        }),
      );
  }

  private async _checkCanManageNodeUser(
    parentNode: User,
    childNode: User,
    requiredPermissions: UserPermissionsType[],
    canManagerPermissions?: boolean,
  ) {
    // because there is some childNode without nodeTree so any below SenLife can be manageable
    if (parentNode.isRoot) return true;

    // you can manage everything of you except your permissions
    if (!canManagerPermissions && childNode.isMe(parentNode.id)) return true;

    // childNode is a descendant of parentNode
    if (childNode.isDescendantOf(parentNode.id)) return true;
    else {
      // this is the top level ancestor user can other from his descendants can access to others descendants
      const ancestorUsers = await this.findAllAncestorsNodes(parentNode.id);
      const topLevelNode = this.getTopLevelNodeByPermission(ancestorUsers, requiredPermissions);

      return this._canManageByTopLevelAndParentNode(topLevelNode, parentNode, childNode);
    }
  }

  private async _findAllByIds(ids: string[]): Promise<User[]> {
    const query = this.userRepo.createQueryBuilder('user');

    if (isEmpty(ids)) return [];
    query.andWhere('user.id IN (:...ids)', { ids: ids });
    query.addSelect(['user.permissions']);
    const users = await query.getMany();
    // order users
    return ids.map((id) => users.find((user) => user.id == id));
  }

  private _canManageByTopLevelAndParentNode(topLevelNode: User, parentNode: User, childNode: User) {
    return topLevelNode
      ? // child Node should be a descendant of one of the allowed your ancestors with that[permission]
        // AND
        // your userType (parentNode.type) is an ancestor type that the childNode
        // example you are MANAGER you are only allowed to manage userType below Manager, PARENT, POST,DOCTOR
        childNode.isDescendantOf(topLevelNode.id) && parentNode.isAncestorUserTypeOf(childNode.type)
      : false;
  }
}
