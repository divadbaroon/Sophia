import { createClient } from '@/utils/supabase/client'

// Upload audio to Supabase
export async function uploadAudioToSupabase(audioBlob: Blob) {
  const supabase = await createClient()
  
  try {
    console.log('📤 Uploading audio to Supabase, size:', audioBlob.size)
    
    const timestamp = Date.now()
    const fileName = `audio_${timestamp}.webm`
    
    const { error } = await supabase.storage
      .from('user-input-audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Upload error:', error)
      return null
    }

    console.log('✅ Audio uploaded:', fileName)
    return fileName
  } catch (error) {
    console.error('❌ Failed to upload audio:', error)
    return null
  }
}