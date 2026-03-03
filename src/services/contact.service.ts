import { Contact } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export class ContactService {
    async identify(email?: string, phoneNumber?: string) {
        const existingContacts = await prisma.contact.findMany({
            where: {
                OR: [{ email: email ?? undefined }, { phoneNumber: phoneNumber ?? undefined }],
            },
        });

        if (existingContacts.length === 0) {
            const newContact = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: "primary",
                    updatedAt: new Date(),
                },
            });

            return {
                contact: {
                    primaryContactId: newContact.id,
                    emails: [newContact.email],
                    phoneNumbers: [newContact.phoneNumber],
                    secondaryContactIds: [],
                },
            };
        }

        const primaryIds = new Set<number>();
        existingContacts.forEach((c: Contact) => {
            primaryIds.add(c.linkPrecedence === "primary" ? c.id : c.linkedId!);
        });

        let relatedContacts = await prisma.contact.findMany({
            where: {
                OR: [{ id: { in: Array.from(primaryIds) } }, { linkedId: { in: Array.from(primaryIds) } }],
            },
        });

        relatedContacts.sort((a: Contact, b: Contact) => a.createdAt.getTime() - b.createdAt.getTime());
        const primaryContact = relatedContacts.find((c: Contact) => c.linkPrecedence === "primary") || relatedContacts[0];

        const actualPrimaryIds = Array.from(new Set(relatedContacts.filter((c: Contact) => c.linkPrecedence === "primary").map((c: Contact) => c.id)));

        if (actualPrimaryIds.length > 1) {
            const rootId = primaryContact.id;
            const otherPrimaryIds = actualPrimaryIds.filter((id) => id !== rootId);

            await prisma.contact.updateMany({
                where: { id: { in: otherPrimaryIds } },
                data: {
                    linkPrecedence: "secondary",
                    linkedId: rootId,
                },
            });

            relatedContacts = await prisma.contact.findMany({
                where: { OR: [{ id: rootId }, { linkedId: rootId }] },
            });
        }

        const hasNewEmail = email && !relatedContacts.some((c: Contact) => c.email === email);
        const hasNewPhone = phoneNumber && !relatedContacts.some((c: Contact) => c.phoneNumber === phoneNumber);

        if (hasNewEmail || hasNewPhone) {
            const newSecondary = await prisma.contact.create({
                data: {
                    email: email ?? null,
                    phoneNumber: phoneNumber ?? null,
                    linkedId: primaryContact.id,
                    linkPrecedence: "secondary",
                },
            });
            relatedContacts.push(newSecondary);
        }

        const emails = Array.from(new Set([primaryContact.email, ...relatedContacts.map((c) => c.email)])).filter(Boolean) as string[];
        const phoneNumbers = Array.from(new Set([primaryContact.phoneNumber, ...relatedContacts.map((c) => c.phoneNumber)])).filter(Boolean) as string[];
        const secondaryContactIds = relatedContacts.filter((c) => c.id !== primaryContact.id).map((c) => c.id);

        return {
            contact: {
                primaryContactId: primaryContact.id,
                emails,
                phoneNumbers,
                secondaryContactIds,
            },
        };
    }
}
