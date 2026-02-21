import { prisma } from "../db/prisma";

function mapBranch(row: {
  id: string;
  name: string;
  address: string;
  city: string;
  googleMapsUrl: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    googleMapsUrl: row.googleMapsUrl,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function listBranches() {
  const rows = await prisma.pickupBranch.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      googleMapsUrl: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return rows.map(mapBranch);
}

export async function createBranch(data: {
  name: string;
  address: string;
  city: string;
  googleMapsUrl?: string | null;
  imageUrl?: string | null;
}) {
  const row = await prisma.pickupBranch.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      googleMapsUrl: data.googleMapsUrl ?? null,
      imageUrl: data.imageUrl ?? null
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      googleMapsUrl: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return mapBranch(row);
}

export async function updateBranch(
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    googleMapsUrl?: string | null;
    imageUrl?: string | null;
  }
) {
  const row = await prisma.pickupBranch.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.googleMapsUrl !== undefined ? { googleMapsUrl: data.googleMapsUrl } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {})
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      googleMapsUrl: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return mapBranch(row);
}

export async function deleteBranch(id: string) {
  const row = await prisma.pickupBranch.delete({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      googleMapsUrl: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return mapBranch(row);
}
