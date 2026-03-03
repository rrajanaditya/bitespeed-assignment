import { Request, Response } from "express";
import { ContactService } from "../services/contact.service.js";

const contactService = new ContactService();

export const identifyContact = async (req: Request, res: Response) => {
    try {
        const { email, phoneNumber } = req.body;
        
        if (!email && !phoneNumber) {
            return res.status(400).json({ error: "Email or Phone Number is required" });
        }

        const result = await contactService.identify(email, phoneNumber?.toString());
        return res.status(200).json(result);


    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
