import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  setName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  contactPersonName: string;
  setContactPersonName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  deliveryaddress: string;
  setDeliveryaddress: (v: string) => void;
  formError: string | null;
  saving: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel: () => void;
}

const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({
  open,
  onOpenChange,
  name,
  setName,
  address,
  setAddress,
  phone,
  setPhone,
  contactPersonName,
  setContactPersonName,
  email,
  setEmail,
  deliveryaddress,
  setDeliveryaddress,
  formError,
  saving,
  onSubmit,
  onCancel,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <Button className="bg-[#800080] cursor-pointer hover:bg-[#660066] text-white">
        <span className="flex items-center">
          <span className="mr-2 text-lg">
            +
          </span>
          Add Supplier
        </span>
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add Customer</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 mt-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name<span className="text-red-600">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address<span className="text-red-600">*</span>
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Customer address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person Name
          </label>
          <Input
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Address
          </label>
          <Input
            value={deliveryaddress}
            onChange={(e) => setDeliveryaddress(e.target.value)}
            placeholder="Optional"
          />
        </div>
        {formError && <div className="text-sm text-red-600">{formError}</div>}
        <DialogFooter className="flex justify-end gap-2">
          <Button
            className="cursor-pointer"
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#800080] cursor-pointer hover:bg-[#660066] text-white"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export default AddCustomerDialog;
