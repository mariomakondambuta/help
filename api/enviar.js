import { Resend } from "resend";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ dest: "/tmp" }); // a Vercel só permite /tmp

// Middleware para tratar upload numa Serverless Function
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false, // necessário para o multer funcionar!
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Método não permitido");
  }

  await runMiddleware(req, res, upload.single("ficheiro"));

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Formulário <onboarding@resend.dev>",
      to: process.env.EMAIL_DESTINO,
      subject: "Novo ficheiro enviado pelo site",
      text: "O utilizador enviou um ficheiro pelo formulário.",
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path,
        },
      ],
    });

    res.status(200).send("Ficheiro enviado com sucesso! 📤");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao enviar o ficheiro ❌");
  }
}
