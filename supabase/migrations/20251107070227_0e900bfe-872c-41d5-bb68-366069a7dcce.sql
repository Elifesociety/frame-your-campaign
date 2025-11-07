-- Create app_role enum for user roles
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create frames table
create table public.frames (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on frames
alter table public.frames enable row level security;

-- RLS policies for user_roles (users can view their own roles)
create policy "Users can view their own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS policies for frames (everyone can view active frames)
create policy "Anyone can view active frames"
  on public.frames
  for select
  to authenticated
  using (is_active = true);

-- Only admins can insert frames
create policy "Admins can insert frames"
  on public.frames
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

-- Only admins can update frames
create policy "Admins can update frames"
  on public.frames
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete frames
create policy "Admins can delete frames"
  on public.frames
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for frames
insert into storage.buckets (id, name, public)
values ('frames', 'frames', true);

-- Storage policies for frames bucket
create policy "Anyone can view frames"
  on storage.objects
  for select
  using (bucket_id = 'frames');

create policy "Admins can upload frames"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'frames' AND
    public.has_role(auth.uid(), 'admin')
  );

create policy "Admins can update frames"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'frames' AND
    public.has_role(auth.uid(), 'admin')
  );

create policy "Admins can delete frames"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'frames' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger for frames table
create trigger set_updated_at
  before update on public.frames
  for each row
  execute function public.handle_updated_at();