import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from '@/types';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (firstName: string, lastName: string) => void;
  existingUser?: User;
  onContinueWithExisting?: () => void;
  onCreateNew?: () => void;
}

export const AuthDialog = ({ 
  isOpen, 
  onClose, 
  onCreateAccount, 
  existingUser, 
  onContinueWithExisting,
  onCreateNew 
}: AuthDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pid, setPid] = useState('');

  if (existingUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome Back!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Would you like to continue as {existingUser.firstName} {existingUser.lastName}?</p>
          </div>
          <DialogFooter>
            <Button onClick={onContinueWithExisting}>Continue with Existing Account</Button>
            <Button variant="outline" onClick={onCreateNew}>Create New Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Office Hours Assistance</DialogTitle>
          <DialogDescription>
            We&apos;re excited to help you out! Please fill in your details below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pid" className="block text-sm font-medium text-gray-700">
              PID
            </label>
            <Input
              id="pid"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => onCreateAccount(firstName, lastName)}
            disabled={!firstName.trim() || !lastName.trim()}
          >
            Join Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );   
};