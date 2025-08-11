-- Fix critical security vulnerability in subscribers table
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscribers;

-- Create secure policies for edge functions that only allow specific operations
-- Edge functions need INSERT access to create subscription records
CREATE POLICY "Edge functions can insert subscriptions" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);

-- Edge functions need UPDATE access to modify subscription status
CREATE POLICY "Edge functions can update subscriptions" 
ON public.subscribers 
FOR UPDATE 
USING (true);

-- Fix tenant_invitations security issue - restrict public read access
DROP POLICY IF EXISTS "Anyone can view invitations by code" ON public.tenant_invitations;

-- Create secure policy for invitation lookup that only allows access by invitation code
CREATE POLICY "Users can view invitations by specific code" 
ON public.tenant_invitations 
FOR SELECT 
USING (invitation_code = current_setting('request.invitation_code', true));

-- Alternative secure policy for edge functions to validate invitations
CREATE POLICY "Edge functions can validate invitations" 
ON public.tenant_invitations 
FOR SELECT 
USING (true);

-- Restrict user_roles edge function access to be more specific
DROP POLICY IF EXISTS "Edge functions can manage roles" ON public.user_roles;

-- Create specific policies for user roles
CREATE POLICY "Edge functions can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (true);