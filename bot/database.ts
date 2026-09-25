interface User {
  id: number;
  balance: number;
  freeRequests: number;
  referralCode: string;
  referredBy?: string;
  totalRequests: number;
  createdAt: number;
  subscription?: {
    plan: 'basic' | 'pro' | 'unlimited';
    requestsLeft: number;
    expiresAt: number;
  };
  isAdmin?: boolean;
}

interface Request {
  userId: number;
  model: string;
  prompt: string;
  tokens?: number;
  cost: number;
  timestamp: number;
}

interface Payment {
  userId: number;
  amount: number;
  cryptoAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  invoiceId: string;
  timestamp: number;
}

export class Database {
  private users = new Map<number, User>();
  private requests: Request[] = [];
  private payments: Payment[] = [];

  getUser(userId: number): User {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        id: userId,
        balance: 0,
        freeRequests: 0,
        referralCode: this.generateReferralCode(userId),
        totalRequests: 0,
        createdAt: Date.now(),
      });
    }
    return this.users.get(userId)!;
  }

  updateBalance(userId: number, amount: number): void {
    const user = this.getUser(userId);
    user.balance += amount;
  }

  addFreeRequests(userId: number, count: number): void {
    const user = this.getUser(userId);
    user.freeRequests += count;
  }

  deductCost(userId: number, cost: number): boolean {
    const user = this.getUser(userId);

    if (user.freeRequests > 0) {
      user.freeRequests--;
      user.totalRequests++;
      return true;
    }

    if (user.balance >= cost) {
      user.balance -= cost;
      user.totalRequests++;
      return true;
    }

    return false;
  }

  setReferrer(userId: number, referralCode: string): boolean {
    const user = this.getUser(userId);

    if (user.referredBy) {
      return false;
    }

    const referrer = Array.from(this.users.values()).find(
      u => u.referralCode === referralCode
    );

    if (!referrer || referrer.id === userId) {
      return false;
    }

    user.referredBy = referralCode;
    this.addFreeRequests(referrer.id, 3);
    return true;
  }

  logRequest(request: Request): void {
    this.requests.push(request);
  }

  addPayment(payment: Payment): void {
    this.payments.push(payment);
  }

  updatePaymentStatus(invoiceId: string, status: 'completed' | 'failed'): void {
    const payment = this.payments.find(p => p.invoiceId === invoiceId);
    if (payment) {
      payment.status = status;
      if (status === 'completed') {
        this.updateBalance(payment.userId, payment.amount);
      }
    }
  }

  getAllRequests(): Request[] {
    return [...this.requests];
  }

  getUserRequests(userId: number): Request[] {
    return this.requests.filter(r => r.userId === userId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  activateSubscription(userId: number, plan: 'basic' | 'pro' | 'unlimited', requestsLimit: number, validityDays: number): void {
    const user = this.getUser(userId);
    user.subscription = {
      plan,
      requestsLeft: requestsLimit,
      expiresAt: Date.now() + validityDays * 24 * 60 * 60 * 1000,
    };
  }

  checkSubscription(userId: number): boolean {
    const user = this.getUser(userId);

    if (!user.subscription) {
      return false;
    }

    if (Date.now() > user.subscription.expiresAt) {
      user.subscription = undefined;
      return false;
    }

    if (user.subscription.requestsLeft === 0) {
      return false;
    }

    return true;
  }

  useSubscriptionRequest(userId: number): boolean {
    const user = this.getUser(userId);

    if (!user.subscription || !this.checkSubscription(userId)) {
      return false;
    }

    if (user.subscription.requestsLeft > 0) {
      user.subscription.requestsLeft--;
    }

    return true;
  }

  setAdmin(userId: number, isAdmin: boolean): void {
    const user = this.getUser(userId);
    user.isAdmin = isAdmin;
  }

  isAdmin(userId: number): boolean {
    const user = this.getUser(userId);
    return user.isAdmin || false;
  }

  private generateReferralCode(userId: number): string {
    return `REF${userId}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}

export const db = new Database();
