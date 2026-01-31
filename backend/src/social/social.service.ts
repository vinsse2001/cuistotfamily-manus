import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(requesterId: string, addresseeNickname: string) {
    // Trim and normalize nickname search
    const normalizedNickname = addresseeNickname.trim();
    const addressee = await this.userRepository.findOne({ 
      where: { nickname: normalizedNickname } 
    });
    
    if (!addressee) {
      throw new NotFoundException(`Utilisateur "${normalizedNickname}" non trouvé`);
    }

    if (requesterId === addressee.id) {
      throw new BadRequestException('Vous ne pouvez pas vous ajouter vous-même');
    }

    // Check for any existing relationship in both directions
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: requesterId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('Vous êtes déjà amis');
      }
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('Une demande est déjà en cours');
      }
      
      // Reset to pending if it was declined or blocked
      existingFriendship.status = FriendshipStatus.PENDING;
      existingFriendship.requesterId = requesterId;
      existingFriendship.addresseeId = addressee.id;
      existingFriendship.createdAt = new Date(); // Update timestamp
      (existingFriendship as any).acceptedAt = null;
      return this.friendshipRepository.save(existingFriendship);
    }

    const friendship = this.friendshipRepository.create({
      requesterId,
      addresseeId: addressee.id,
      status: FriendshipStatus.PENDING
    });

    return this.friendshipRepository.save(friendship);
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: requestId, addresseeId: userId, status: FriendshipStatus.PENDING }
    });

    if (!friendship) {
      throw new NotFoundException('Demande d\'ami non trouvée');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    friendship.acceptedAt = new Date();
    return this.friendshipRepository.save(friendship);
  }

  async declineFriendRequest(userId: string, requestId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: requestId, addresseeId: userId, status: FriendshipStatus.PENDING }
    });

    if (!friendship) {
      throw new NotFoundException('Demande d\'ami non trouvée');
    }

    friendship.status = FriendshipStatus.DECLINED;
    return this.friendshipRepository.save(friendship);
  }

  async getFriends(userId: string) {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED }
      ],
      relations: ['requester', 'addressee']
    });

    return friendships.map(f => f.requesterId === userId ? f.addressee : f.requester);
  }

  async getPendingRequests(userId: string) {
    // Ensure we only get requests where the current user is the addressee
    return this.friendshipRepository.find({
      where: { 
        addresseeId: userId, 
        status: FriendshipStatus.PENDING 
      },
      relations: ['requester'],
      order: { createdAt: 'DESC' }
    });
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId: userId, addresseeId: friendId, status: FriendshipStatus.ACCEPTED },
        { requesterId: friendId, addresseeId: userId, status: FriendshipStatus.ACCEPTED }
      ]
    });

    if (!friendship) {
      throw new NotFoundException('Relation d\'amitié non trouvée');
    }

    return this.friendshipRepository.remove(friendship);
  }

  async isFriend(userId: string, otherUserId: string): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId: userId, addresseeId: otherUserId, status: FriendshipStatus.ACCEPTED },
        { requesterId: otherUserId, addresseeId: userId, status: FriendshipStatus.ACCEPTED }
      ]
    });
    return !!friendship;
  }

  async searchUsers(query: string, currentUserId: string) {
    // Recherche par nickname, excluant l'utilisateur actuel
    // On pourrait aussi retourner le statut de la relation avec chaque utilisateur trouvé
    const users = await this.userRepository.createQueryBuilder('user')
      .where('user.nickname ILIKE :query', { query: `%${query}%` })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .select(['user.id', 'user.nickname'])
      .limit(10)
      .getMany();

    // Pour chaque utilisateur trouvé, on cherche s'il y a une relation existante
    const results = await Promise.all(users.map(async (user) => {
      const friendship = await this.friendshipRepository.findOne({
        where: [
          { requesterId: currentUserId, addresseeId: user.id },
          { requesterId: user.id, addresseeId: currentUserId }
        ]
      });
      return {
        ...user,
        friendshipStatus: friendship ? friendship.status : null,
        isRequester: friendship ? friendship.requesterId === currentUserId : false
      };
    }));

    return results;
  }
}
