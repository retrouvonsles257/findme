/**
 * Supabase Edge Function - Hugging Face API Proxy
 * 
 * Cette fonction proxy toutes les requêtes vers l'API Hugging Face
 * pour éviter les problèmes CORS dans le navigateur.
 * 
 * Deploy: supabase functions deploy huggingface-proxy
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Modèles disponibles et fonctionnels sur Hugging Face Inference API
const AVAILABLE_MODELS = {
  // Classification d'images
  IMAGE_CLASSIFICATION: 'google/vit-base-patch16-224',
  
  // Génération de description
  IMAGE_CAPTIONING: 'Salesforce/blip-image-captioning-base',
  
  // Détection d'objets
  OBJECT_DETECTION: 'facebook/detr-resnet-50',
  
  // Classification d'âge
  AGE_CLASSIFICATION: 'nateraw/vit-age-classifier',
  
  // Détection d'émotions faciales
  EMOTION_DETECTION: 'trpakov/vit-face-expression',
};

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-model',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer la clé API depuis les secrets Supabase
    const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
    
    if (!HF_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Hugging Face API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Récupérer le modèle depuis le header
    const model = req.headers.get('x-model') || AVAILABLE_MODELS.IMAGE_CLASSIFICATION;
    
    // Récupérer les données de l'image
    const imageData = await req.arrayBuffer();
    
    console.log(`[HuggingFace Proxy] Calling model: ${model}`);
    console.log(`[HuggingFace Proxy] Image size: ${imageData.byteLength} bytes`);

    // Appeler l'API Hugging Face (NOUVEAU endpoint 2025)
    const hfResponse = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageData,
    });

    const responseText = await hfResponse.text();
    
    console.log(`[HuggingFace Proxy] Response status: ${hfResponse.status}`);
    
    // Si le modèle est en train de charger
    if (hfResponse.status === 503) {
      const errorData = JSON.parse(responseText);
      console.log(`[HuggingFace Proxy] Model loading, estimated time: ${errorData.estimated_time}s`);
      return new Response(
        JSON.stringify({
          error: 'Model is loading',
          estimated_time: errorData.estimated_time,
          loading: true,
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Erreur d'authentification
    if (hfResponse.status === 401) {
      return new Response(
        JSON.stringify({ error: 'Invalid Hugging Face API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Autres erreurs
    if (!hfResponse.ok) {
      console.error(`[HuggingFace Proxy] Error: ${responseText}`);
      return new Response(
        JSON.stringify({ 
          error: `API Error: ${hfResponse.status}`,
          details: responseText,
        }),
        { 
          status: hfResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Succès - retourner la réponse
    return new Response(responseText, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Model-Used': model,
      },
    });

  } catch (error) {
    console.error('[HuggingFace Proxy] Exception:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
    );
  }
});
